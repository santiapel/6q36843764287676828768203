<script type="module">

/* =========================================
   FIREBASE
   ========================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================
   CONFIG
   ========================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyAe2LC8Mopcf8NTjhnS_tCCN8Fj5bvIX4E",

  authDomain:
    "banco-de-mama.firebaseapp.com",

  projectId:
    "banco-de-mama",

  storageBucket:
    "banco-de-mama.firebasestorage.app",

  messagingSenderId:
    "551441991939",

  appId:
    "1:551441991939:web:e1b7e5901bc51d86b44136"

};


const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


/* =========================================
   CUENTAS PERMITIDAS
   ========================================= */

const ACCOUNTS = {

  santi: {
    name: "Santi",
    email: "santipapel16@gmail.com",
    icon: "👤",
    admin: false
  },

  leonel: {
    name: "Leonel",
    email: "leoxdfunes@gmail.com",
    icon: "👤",
    admin: false
  },

  gabriela: {
    name: "Gabriela",
    email: "gabyhuchy@gmail.com",
    icon: "👑",
    admin: true
  }

};


const ADMIN_EMAILS = [

  "gabyhuchy@gmail.com",
  "gabyhuchy@hotmail.com"

];


const ALLOWED_EMAILS = [

  "santipapel16@gmail.com",
  "leoxdfunes@gmail.com",
  "gabyhuchy@gmail.com",
  "gabyhuchy@hotmail.com"

];


/* =========================================
   LOGIN
   ========================================= */

const accountSelection =
  document.getElementById(
    "accountSelection"
  );

const emailConfirmation =
  document.getElementById(
    "emailConfirmation"
  );

const emailSent =
  document.getElementById(
    "emailSent"
  );

const selectedAccount =
  document.getElementById(
    "selectedAccount"
  );

const sentEmail =
  document.getElementById(
    "sentEmail"
  );

const sendEmailButton =
  document.getElementById(
    "sendEmailButton"
  );

const backAccounts =
  document.getElementById(
    "backAccounts"
  );


let selectedAccountData = null;


/* =========================================
   CONFIGURACIÓN DEL ENLACE
   ========================================= */

const actionCodeSettings = {

  url:
    window.location.origin +
    window.location.pathname,

  handleCodeInApp:
    true

};


/* =========================================
   TOAST
   ========================================= */

const toast =
  document.getElementById(
    "toast"
  );


function showToast(message) {

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 3000);

}


/* =========================================
   SELECCIONAR CUENTA
   ========================================= */

document
  .querySelectorAll(".account-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const accountName =
          button.dataset.name;

        const accountEmail =
          button.dataset.email;


        selectedAccountData = {

          name:
            accountName,

          email:
            accountEmail

        };


        let icon =
          "👤";


        if (
          accountEmail ===
          "gabyhuchy@gmail.com"
        ) {

          icon =
            "👑";

        }


        selectedAccount.innerHTML = `

          <div class="selected-icon">
            ${icon}
          </div>

          <div>

            <strong>
              ${escapeHTML(accountName)}
            </strong>

            <span>
              ${escapeHTML(accountEmail)}
            </span>

          </div>

        `;


        accountSelection.style.display =
          "none";

        emailConfirmation.style.display =
          "block";

      }
    );

  });


/* =========================================
   VOLVER A CUENTAS
   ========================================= */

backAccounts.addEventListener(
  "click",
  () => {

    emailConfirmation.style.display =
      "none";

    accountSelection.style.display =
      "block";

  }
);


/* =========================================
   ENVIAR EMAIL
   ========================================= */

sendEmailButton.addEventListener(
  "click",
  async () => {

    if (!selectedAccountData) {

      showToast(
        "Seleccioná una cuenta."
      );

      return;

    }


    const email =
      selectedAccountData.email
        .toLowerCase()
        .trim();


    if (
      !ALLOWED_EMAILS.includes(
        email
      )
    ) {

      showToast(
        "Esta cuenta no está autorizada."
      );

      return;

    }


    sendEmailButton.disabled =
      true;

    sendEmailButton.textContent =
      "Enviando correo...";


    try {

      /*
       * Guardamos la cuenta elegida.
       */

      localStorage.setItem(
        "momcoin_selected_email",
        email
      );


      localStorage.setItem(
        "momcoin_selected_name",
        selectedAccountData.name
      );


      /*
       * Firebase manda el enlace mágico.
       */

      await sendSignInLinkToEmail(
        auth,
        email,
        actionCodeSettings
      );


      sentEmail.textContent =
        email;


      emailConfirmation.style.display =
        "none";

      emailSent.style.display =
        "block";


      showToast(
        "📧 Revisá tu correo."
      );


    } catch (error) {

      console.error(
        "Error enviando email:",
        error
      );


      if (
        error.code ===
        "auth/unauthorized-continue-uri"
      ) {

        showToast(
          "El dominio no está autorizado en Firebase."
        );

      } else if (
        error.code ===
        "auth/invalid-email"
      ) {

        showToast(
          "El correo no es válido."
        );

      } else if (
        error.code ===
        "auth/operation-not-allowed"
      ) {

        showToast(
          "Tenés que activar Email Link en Firebase."
        );

      } else {

        showToast(
          "No se pudo enviar el correo."
        );

      }


      sendEmailButton.disabled =
        false;

      sendEmailButton.textContent =
        "📧 Enviar correo de confirmación";

    }

  }
);


/* =========================================
   CONFIRMAR ENLACE MÁGICO
   ========================================= */

async function processEmailLink() {

  if (
    !isSignInWithEmailLink(
      auth,
      window.location.href
    )
  ) {

    return;

  }


  let email =
    localStorage.getItem(
      "momcoin_selected_email"
    );


  /*
   * Si por alguna razón se perdió
   * el localStorage, pedimos el correo.
   */

  if (!email) {

    email =
      window.prompt(
        "Confirmá tu correo electrónico:"
      );

  }


  if (!email) {

    showToast(
      "No se pudo identificar la cuenta."
    );

    return;

  }


  email =
    email
      .trim()
      .toLowerCase();


  if (
    !ALLOWED_EMAILS.includes(
      email
    )
  ) {

    showToast(
      "Esta cuenta no está autorizada."
    );

    return;

  }


  try {

    const result =
      await signInWithEmailLink(
        auth,
        email,
        window.location.href
      );


    /*
     * Limpiamos datos temporales.
     */

    localStorage.removeItem(
      "momcoin_selected_email"
    );

    localStorage.removeItem(
      "momcoin_selected_name"
    );


    /*
     * Limpiamos la URL.
     */

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );


    console.log(
      "Login correcto:",
      result.user.email
    );


  } catch (error) {

    console.error(
      "Error autenticando:",
      error
    );

    showToast(
      "El enlace no es válido o expiró."
    );

  }

}


processEmailLink();


/* =========================================
   ELEMENTOS APP
   ========================================= */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const appScreen =
  document.getElementById(
    "app"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const balanceElement =
  document.getElementById(
    "balance"
  );

const privacyButton =
  document.getElementById(
    "privacyButton"
  );

const profileName =
  document.getElementById(
    "profileName"
  );

const profileEmail =
  document.getElementById(
    "profileEmail"
  );

const profileAvatar =
  document.getElementById(
    "profileAvatar"
  );

const headerName =
  document.getElementById(
    "headerName"
  );

const headerAvatar =
  document.getElementById(
    "headerAvatar"
  );

const headerRole =
  document.getElementById(
    "headerRole"
  );

const roleBadge =
  document.getElementById(
    "roleBadge"
  );

const adminPanel =
  document.getElementById(
    "adminPanel"
  );

const recipientEmail =
  document.getElementById(
    "recipientEmail"
  );

const sendAmount =
  document.getElementById(
    "sendAmount"
  );

const sendReason =
  document.getElementById(
    "sendReason"
  );

const sendCoinsButton =
  document.getElementById(
    "sendCoinsButton"
  );

const transactionsList =
  document.getElementById(
    "transactionsList"
  );

const transactionCount =
  document.getElementById(
    "transactionCount"
  );

const notificationsList =
  document.getElementById(
    "notificationsList"
  );

const notificationCount =
  document.getElementById(
    "notificationCount"
  );


/* =========================================
   ESTADO
   ========================================= */

let currentUser = null;

let currentBalance = 0;

let privateMode = false;

let unsubscribeTransactions = null;

let unsubscribeNotifications = null;


/* =========================================
   SALDO
   ========================================= */

function updateBalanceUI() {

  if (privateMode) {

    balanceElement.textContent =
      "••••••";

  } else {

    balanceElement.textContent =
      Number(
        currentBalance || 0
      ).toLocaleString(
        "es-AR"
      );

  }


  privacyButton.textContent =
    privateMode
      ? "🙈 Mostrar"
      : "👁 Ocultar";

}


privacyButton.addEventListener(
  "click",
  () => {

    privateMode =
      !privateMode;

    updateBalanceUI();

  }
);


/* =========================================
   PERFIL
   ========================================= */

function loadUserProfile(user) {

  const name =
    user.displayName ||
    "Usuario";

  const email =
    user.email ||
    "";


  let avatar =
    user.photoURL;


  if (!avatar) {

    avatar =
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}`;

  }


  profileName.textContent =
    name;

  profileEmail.textContent =
    email;

  profileAvatar.src =
    avatar;

  headerName.textContent =
    name;

  headerAvatar.src =
    avatar;


  if (
    isAdmin(user)
  ) {

    roleBadge.textContent =
      "👑 ADMIN";

    headerRole.textContent =
      "Administrador";

  } else {

    roleBadge.textContent =
      "USUARIO";

    headerRole.textContent =
      "Wallet personal";

  }

}


/* =========================================
   PERMISOS
   ========================================= */

function isAdmin(user) {

  return Boolean(
    user?.email &&
    ADMIN_EMAILS.includes(
      user.email.toLowerCase()
    )
  );

}


function isAllowedUser(user) {

  return Boolean(
    user?.email &&
    ALLOWED_EMAILS.includes(
      user.email.toLowerCase()
    )
  );

}


/* =========================================
   PANEL DE MAMÁ
   ========================================= */

function updateAdminUI(user) {

  if (
    isAdmin(user)
  ) {

    adminPanel.style.display =
      "block";

  } else {

    adminPanel.style.display =
      "none";

  }

}


/* =========================================
   CARGAR / CREAR USUARIO
   ========================================= */

async function ensureUserDocument(user) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );


  const snapshot =
    await getDoc(
      userRef
    );


  if (
    !snapshot.exists()
  ) {

    await setDoc(
      userRef,
      {

        email:
          user.email,

        displayName:
          user.displayName ||
          localStorage.getItem(
            "momcoin_selected_name"
          ) ||
          "Usuario",

        balance:
          0

      }
    );

  }

}


/* =========================================
   CARGAR SALDO
   ========================================= */

async function loadBalance(user) {

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );


    const snapshot =
      await getDoc(
        userRef
      );


    if (
      !snapshot.exists()
    ) {

      currentBalance =
        0;

      updateBalanceUI();

      return;

    }


    const data =
      snapshot.data();


    currentBalance =
      Number(
        data.balance ??
        data.coins ??
        0
      );


    updateBalanceUI();

  } catch (error) {

    console.error(
      "Balance:",
      error
    );

    balanceElement.textContent =
      "Error";

  }

}


/* =========================================
   MOVIMIENTOS
   ========================================= */

function listenToTransactions(user) {

  if (
    unsubscribeTransactions
  ) {

    unsubscribeTransactions();

  }


  const transactionsRef =
    collection(
      db,
      "transactions"
    );


  const transactionsQuery =
    query(

      transactionsRef,

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
          `${snapshot.size} ${
            snapshot.size === 1
              ? "movimiento"
              : "movimientos"
          }`;


        if (
          snapshot.empty
        ) {

          transactionsList.innerHTML = `
            <div class="empty">
              Todavía no tenés movimientos. 💸
            </div>
          `;

          return;

        }


        snapshot.forEach(
          transactionDoc => {

            renderTransaction(
              transactionDoc.data()
            );

          }
        );

      },

      error => {

        console.error(
          "Transactions:",
          error
        );

        transactionsList.innerHTML = `
          <div class="empty">
            No se pudieron cargar los movimientos.
          </div>
        `;

      }

    );

}


/* =========================================
   RENDER MOVIMIENTO
   ========================================= */

function renderTransaction(data) {

  const amount =
    Number(
      data.amount || 0
    );


  const type =
    data.type ||
    "income";


  const income =
    type === "income" ||
    type === "deposit" ||
    type === "credit";


  const title =
    data.title ||
    data.description ||
    "Movimiento";


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "transaction";


  element.innerHTML = `

    <div class="transaction-left">

      <div class="transaction-icon">
        ${income ? "↓" : "↑"}
      </div>

      <div class="transaction-info">

        <div class="transaction-title">
          ${escapeHTML(title)}
        </div>

        <div class="transaction-date">
          ${formatDate(data.created_at)}
        </div>

      </div>

    </div>

    <div class="transaction-amount ${
      income
        ? "income"
        : "expense"
    }">

      ${income ? "+" : "-"}${Math.abs(
        amount
      ).toLocaleString(
        "es-AR"
      )} MC

    </div>

  `;


  transactionsList.appendChild(
    element
  );

}


/* =========================================
   NOTIFICACIONES
   ========================================= */

function listenToNotifications(user) {

  if (
    unsubscribeNotifications
  ) {

    unsubscribeNotifications();

  }


  const notificationsRef =
    collection(
      db,
      "notifications"
    );


  const notificationsQuery =
    query(

      notificationsRef,

      where(
        "userId",
        "==",
        user.uid
      ),

      orderBy(
        "created_at",
        "desc"
      )

    );


  unsubscribeNotifications =
    onSnapshot(

      notificationsQuery,

      snapshot => {

        notificationsList.innerHTML =
          "";


        notificationCount.textContent =
          snapshot.size;


        if (
          snapshot.empty
        ) {

          notificationsList.innerHTML = `
            <div class="empty">
              No tenés notificaciones todavía. 🔔
            </div>
          `;

          return;

        }


        snapshot.forEach(
          notificationDoc => {

            const data =
              notificationDoc.data();


            const element =
              document.createElement(
                "div"
              );


            element.className =
              "transaction";


            element.innerHTML = `

              <div class="transaction-left">

                <div class="transaction-icon">
                  🔔
                </div>

                <div class="transaction-info">

                  <div class="transaction-title">
                    ${escapeHTML(
                      data.title ||
                      "Notificación"
                    )}
                  </div>

                  <div class="transaction-date">
                    ${escapeHTML(
                      data.message ||
                      ""
                    )}
                  </div>

                </div>

              </div>

            `;


            notificationsList.appendChild(
              element
            );

          }
        );

      },

      error => {

        console.error(
          "Notifications:",
          error
        );

      }

    );

}


/* =========================================
   ENVIAR MOM COINS
   ========================================= */

sendCoinsButton.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !isAdmin(currentUser)
    ) {

      showToast(
        "No tenés permisos de administrador."
      );

      return;

    }


    const email =
      recipientEmail.value
        .trim()
        .toLowerCase();


    const amount =
      Number(
        sendAmount.value
      );


    const reason =
      sendReason.value.trim() ||
      "Mom Coins recibidos";


    if (!email) {

      showToast(
        "Seleccioná un destinatario."
      );

      return;

    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      showToast(
        "Ingresá una cantidad válida."
      );

      return;

    }


    sendCoinsButton.disabled =
      true;

    sendCoinsButton.textContent =
      "Enviando...";


    try {

      const usersQuery =
        query(

          collection(
            db,
            "users"
          ),

          where(
            "email",
            "==",
            email
          )

        );


      const usersSnapshot =
        await getDocs(
          usersQuery
        );


      if (
        usersSnapshot.empty
      ) {

        showToast(
          "Ese usuario todavía no inició sesión."
        );

        return;

      }


      const recipientDoc =
        usersSnapshot.docs[0];


      const recipientRef =
        recipientDoc.ref;


      const senderRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      await runTransaction(
        db,
        async transaction => {

          const senderSnapshot =
            await transaction.get(
              senderRef
            );


          const recipientSnapshot =
            await transaction.get(
              recipientRef
            );


          if (
            !senderSnapshot.exists() ||
            !recipientSnapshot.exists()
          ) {

            throw new Error(
              "USER_NOT_FOUND"
            );

          }


          const senderData =
            senderSnapshot.data();


          const recipientData =
            recipientSnapshot.data();


          const senderBalance =
            Number(
              senderData.balance ??
              0
            );


          const recipientBalance =
            Number(
              recipientData.balance ??
              0
            );


          /*
           * Mamá no puede enviar más
           * de lo que tiene.
           */

          if (
            senderBalance < amount
          ) {

            throw new Error(
              "INSUFFICIENT_BALANCE"
            );

          }


          /*
           * Restar a mamá.
           */

          transaction.update(

            senderRef,

            {
              balance:
                senderBalance -
                amount
            }

          );


          /*
           * Sumar al destinatario.
           */

          transaction.update(

            recipientRef,

            {
              balance:
                recipientBalance +
                amount
            }

          );


          /*
           * Movimiento del destinatario.
           */

          const recipientTransaction =
            doc(
              collection(
                db,
                "transactions"
              )
            );


          transaction.set(

            recipientTransaction,

            {

              user_ref:
                recipientDoc.id,

              from_uid:
                currentUser.uid,

              from_email:
                currentUser.email,

              to_email:
                email,

              amount:
                amount,

              type:
                "income",

              title:
                reason,

              created_at:
                serverTimestamp()

            }

          );


          /*
           * Notificación.
           */

          const notificationRef =
            doc(
              collection(
                db,
                "notifications"
              )
            );


          transaction.set(

            notificationRef,

            {

              userId:
                recipientDoc.id,

              title:
                "💰 Recibiste Mom Coins",

              message:
                `Recibiste ${amount} Mom Coins. Motivo: ${reason}`,

              read:
                false,

              created_at:
                serverTimestamp()

            }

          );

        }
      );


      /*
       * Actualizamos inmediatamente
       * el saldo mostrado de mamá.
       */

      await loadBalance(
        currentUser
      );


      showToast(
        "💰 Mom Coins enviados."
      );


      recipientEmail.value =
        "";

      sendAmount.value =
        "";

      sendReason.value =
        "";


    } catch (error) {

      console.error(
        "Send coins:",
        error
      );


      if (
        error.message ===
        "INSUFFICIENT_BALANCE"
      ) {

        showToast(
          "Mamá no tiene suficientes Mom Coins."
        );

      } else {

        showToast(
          "No se pudo completar la transferencia."
        );

      }

    } finally {

      sendCoinsButton.disabled =
        false;

      sendCoinsButton.textContent =
        "💸 Enviar Mom Coins";

    }

  }
);


/* =========================================
   FECHAS
   ========================================= */

function formatDate(timestamp) {

  if (!timestamp) {

    return "Fecha pendiente";

  }


  let date;


  if (
    typeof timestamp.toDate ===
    "function"
  ) {

    date =
      timestamp.toDate();

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


/* =========================================
   SEGURIDAD HTML
   ========================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================
   AUTH STATE
   ========================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user) {

      loginScreen.style.display =
        "flex";

      appScreen.style.display =
        "none";

      return;

    }


    /*
     * Comprobar correo permitido.
     */

    if (
      !isAllowedUser(user)
    ) {

      showToast(
        "Esta cuenta no está autorizada."
      );

      await signOut(
        auth
      );

      return;

    }


    /*
     * Mostrar aplicación.
     */

    loginScreen.style.display =
      "none";

    appScreen.style.display =
      "block";


    /*
     * Crear perfil si no existe.
     */

    try {

      await ensureUserDocument(
        user
      );

    } catch (error) {

      console.error(
        "User document:",
        error
      );

    }


    /*
     * Cargar todo.
     */

    loadUserProfile(
      user
    );

    updateAdminUI(
      user
    );

    await loadBalance(
      user
    );

    listenToTransactions(
      user
    );

    listenToNotifications(
      user
    );

  }
);


/* =========================================
   CERRAR SESIÓN
   ========================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );

      showToast(
        "Sesión cerrada."
      );

    } catch (error) {

      console.error(
        "Logout:",
        error
      );

    }

  }
);

</script>
