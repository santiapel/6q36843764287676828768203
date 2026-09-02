import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    firebaseConfig
} from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);

const googleProvider =
    new GoogleAuthProvider();


// ============================================================
// DOM
// ============================================================

const authScreen =
    document.getElementById("auth-screen");

const appScreen =
    document.getElementById("app-screen");

const googleLogin =
    document.getElementById("google-login");

const logoutButton =
    document.getElementById("logout-button");

const balanceValue =
    document.getElementById("balance-value");

const privacyButton =
    document.getElementById("privacy-button");

const privacyIcon =
    document.getElementById("privacy-icon");

const welcomeTitle =
    document.getElementById("welcome-title");

const headerAvatar =
    document.getElementById("header-avatar");

const profileAvatar =
    document.getElementById("profile-avatar");

const profileName =
    document.getElementById("profile-name");

const profileEmail =
    document.getElementById("profile-email");

const profileUid =
    document.getElementById("profile-uid");

const copyUid =
    document.getElementById("copy-uid");

const transactionsList =
    document.getElementById("transactions-list");

const transactionCount =
    document.getElementById("transaction-count");

const toast =
    document.getElementById("toast");


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let currentBalance = 0;

let privateMode = false;

let unsubscribeTransactions = null;


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("visible");

    window.clearTimeout(
        showToast.timeout
    );

    showToast.timeout =
        window.setTimeout(() => {

            toast.classList.remove(
                "visible"
            );

        }, 3000);
}


// ============================================================
// AUTH
// ============================================================

googleLogin.addEventListener(
    "click",
    async () => {

        googleLogin.disabled = true;

        googleLogin.querySelector("span")
            .textContent =
            "Conectando...";

        try {

            await signInWithPopup(
                auth,
                googleProvider
            );

        } catch (error) {

            console.error(error);

            /*
             * Si el navegador bloquea el popup,
             * utilizamos redirect.
             */

            if (
                error.code ===
                "auth/popup-blocked"
            ) {

                await signInWithRedirect(
                    auth,
                    googleProvider
                );

                return;
            }

            showToast(
                getAuthError(error)
            );

            googleLogin.disabled = false;

            googleLogin.querySelector("span")
                .textContent =
                "Continuar con Google";
        }
    }
);


// Resultado del login mediante redirect.

getRedirectResult(auth)
    .catch(error => {

        console.error(
            "Redirect error:",
            error
        );

        showToast(
            getAuthError(error)
        );
    });


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;

        if (!user) {

            showAuth();

            return;
        }

        showApp();

        renderUser(user);

        await loadBalance(user);

        subscribeTransactions(user);
    }
);


// ============================================================
// SCREEN CONTROL
// ============================================================

function showAuth() {

    authScreen.classList.remove(
        "hidden"
    );

    appScreen.classList.add(
        "hidden"
    );
}


function showApp() {

    authScreen.classList.add(
        "hidden"
    );

    appScreen.classList.remove(
        "hidden"
    );
}


// ============================================================
// USER
// ============================================================

function renderUser(user) {

    const name =
        user.displayName ||
        "Usuario";

    const email =
        user.email ||
        "Sin correo";

    const avatar =
        user.photoURL ||
        createAvatar(name);


    welcomeTitle.textContent =
        `Hola, ${getFirstName(name)} 👋`;

    profileName.textContent =
        name;

    profileEmail.textContent =
        email;

    profileUid.textContent =
        user.uid;

    headerAvatar.src =
        avatar;

    profileAvatar.src =
        avatar;
}


function getFirstName(name) {

    return name
        .trim()
        .split(/\s+/)[0];
}


function createAvatar(name) {

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
    )}&background=6657f5&color=fff`;
}


// ============================================================
// BALANCE
// ============================================================

async function loadBalance(user) {

    balanceValue.textContent =
        "Cargando...";

    try {

        const userReference =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(
                userReference
            );

        if (!snapshot.exists()) {

            currentBalance = 0;

            updateBalance();

            return;
        }

        const data =
            snapshot.data();

        if (
            typeof data.balance ===
            "number"
        ) {

            currentBalance =
                data.balance;

        } else if (
            typeof data.coins ===
            "number"
        ) {

            currentBalance =
                data.coins;

        } else {

            currentBalance = 0;
        }

        updateBalance();

    } catch (error) {

        console.error(
            "Balance error:",
            error
        );

        balanceValue.textContent =
            "Error";

        showToast(
            "No se pudo cargar el saldo."
        );
    }
}


function updateBalance() {

    if (privateMode) {

        balanceValue.textContent =
            "••••••";

        privacyIcon.textContent =
            "◎";

        return;
    }

    balanceValue.textContent =
        formatMoney(currentBalance);

    privacyIcon.textContent =
        "◉";
}


function formatMoney(value) {

    return `$${Number(value || 0)
        .toLocaleString(
            "es-AR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )}`;
}


// ============================================================
// PRIVATE MODE
// ============================================================

privacyButton.addEventListener(
    "click",
    () => {

        privateMode =
            !privateMode;

        updateBalance();
    }
);


// ============================================================
// TRANSACTIONS
// ============================================================

function subscribeTransactions(user) {

    if (unsubscribeTransactions) {

        unsubscribeTransactions();

        unsubscribeTransactions =
            null;
    }


    const transactions =
        collection(
            db,
            "transactions"
        );


    const transactionsQuery =
        query(
            transactions,

            where(
                "user_ref",
                "==",
                user.uid
            ),

            orderBy(
                "created_at",
                "desc"
            )
        );


    unsubscribeTransactions =
        onSnapshot(
            transactionsQuery,

            snapshot => {

                transactionsList.innerHTML =
                    "";

                transactionCount.textContent =
                    snapshot.size;

                if (snapshot.empty) {

                    transactionsList.innerHTML = `
                        <div class="empty-state">
                            <strong>
                                No hay movimientos
                            </strong>

                            <span>
                                Cuando tengas actividad,
                                aparecerá acá.
                            </span>
                        </div>
                    `;

                    return;
                }


                snapshot.forEach(
                    transaction => {

                        renderTransaction(
                            transaction.data()
                        );
                    }
                );
            },

            error => {

                console.error(
                    "Transactions error:",
                    error
                );

                transactionsList.innerHTML = `
                    <div class="error-state">
                        <strong>
                            No se pudieron cargar
                            los movimientos.
                        </strong>

                        <span>
                            Revisá las reglas e índices
                            de Firestore.
                        </span>
                    </div>
                `;
            }
        );
}


// ============================================================
// TRANSACTION RENDER
// ============================================================

function renderTransaction(data) {

    const amount =
        Number(data.amount || 0);

    const type =
        data.type ||
        (
            amount >= 0
                ? "income"
                : "expense"
        );

    const income =
        type === "income" ||
        type === "deposit" ||
        type === "credit" ||
        (
            !data.type &&
            amount >= 0
        );

    const title =
        data.title ||
        data.description ||
        "Movimiento";

    const icon =
        income
            ? "↓"
            : "↑";

    const sign =
        income
            ? "+"
            : "-";

    const date =
        formatDate(
            data.created_at
        );


    const element =
        document.createElement(
            "article"
        );

    element.className =
        "transaction";


    const main =
        document.createElement(
            "div"
        );

    main.className =
        "transaction-main";


    const iconElement =
        document.createElement(
            "div"
        );

    iconElement.className =
        "transaction-icon";

    iconElement.textContent =
        icon;


    const details =
        document.createElement(
            "div"
        );

    details.className =
        "transaction-details";


    const titleElement =
        document.createElement(
            "div"
        );

    titleElement.className =
        "transaction-title";

    titleElement.textContent =
        title;


    const dateElement =
        document.createElement(
            "div"
        );

    dateElement.className =
        "transaction-date";

    dateElement.textContent =
        date;


    details.append(
        titleElement,
        dateElement
    );

    main.append(
        iconElement,
        details
    );


    const amountElement =
        document.createElement(
            "div"
        );

    amountElement.className =
        `transaction-amount ${
            income
                ? "income"
                : "expense"
        }`;

    amountElement.textContent =
        `${sign}${formatMoney(
            Math.abs(amount)
        )}`;


    element.append(
        main,
        amountElement
    );

    transactionsList.appendChild(
        element
    );
}


// ============================================================
// DATE
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "Fecha desconocida";
    }

    let date;

    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    } else if (
        timestamp instanceof Date
    ) {

        date =
            timestamp;

    } else if (
        typeof timestamp ===
        "number"
    ) {

        date =
            new Date(timestamp);

    } else {

        return "Fecha desconocida";
    }


    return date.toLocaleString(
        "es-AR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ============================================================
// COPY UID
// ============================================================

copyUid.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                currentUser.uid
            );

            copyUid.textContent =
                "Copiado ✓";

            showToast(
                "UID copiado."
            );

            setTimeout(() => {

                copyUid.textContent =
                    "Copiar";

            }, 1800);

        } catch {

            showToast(
                "No se pudo copiar."
            );
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            if (
                unsubscribeTransactions
            ) {

                unsubscribeTransactions();

                unsubscribeTransactions =
                    null;
            }

        } catch (error) {

            console.error(error);

            showToast(
                "No se pudo cerrar sesión."
            );
        }
    }
);


// ============================================================
// AUTH ERRORS
// ============================================================

function getAuthError(error) {

    switch (error.code) {

        case "auth/popup-closed-by-user":
            return "Cerraste la ventana de Google.";

        case "auth/popup-blocked":
            return "El navegador bloqueó el popup.";

        case "auth/unauthorized-domain":
            return "Este dominio no está autorizado en Firebase.";

        case "auth/network-request-failed":
            return "Error de conexión.";

        default:
            return "No se pudo iniciar sesión.";
    }
}
