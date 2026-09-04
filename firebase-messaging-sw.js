// Importa los scripts de Firebase necesarios para el Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

// Inicializa Firebase en el Service Worker con tu configuración
firebase.initializeApp({
  apiKey: "AIzaSyAe2LC8Mopcf8NTjhnS_tCCN8Fj5bvIX4E",
  authDomain: "banco-de-mama.firebaseapp.com",
  projectId: "banco-de-mama",
  storageBucket: "banco-de-mama.firebasestorage.app",
  messagingSenderId: "551441991939",
  appId: "1:551441991939:web:e1b7e5901bc51d86b44136"
});

const messaging = firebase.messaging();

// Manejador opcional para notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://i.ibb.co/SWGbzbR/Gemini-Generated-Image-gv4lhtgv4lhtgv4l.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
