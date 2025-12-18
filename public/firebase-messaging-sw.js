// firebase-messaging-sw.js

// Firebase compat SDK 로드
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

// Firebase 초기화 (app.js 와 동일한 설정)
firebase.initializeApp({
    apiKey: "AIzaSyDxtXl0mnUpaMhkTPhlbYVr9o49oX7sJks",
    authDomain: "kid-chat-2ca0f.firebaseapp.com",
    projectId: "kid-chat-2ca0f",
    storageBucket: "kid-chat-2ca0f.firebasestorage.app",
    messagingSenderId: "1097422182914",
    appId: "1:1097422182914:web:cb798a95684b0b0c39e51b",
    measurementId: "G-YSWET2DE8E"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리 (최소 버전)
messaging.onBackgroundMessage(function (payload) {
    console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신:", payload);

    var title =
        (payload.notification && payload.notification.title) || "Kid Chat";
    var body =
        (payload.notification && payload.notification.body) ||
        "새 메시지가 도착했어요!";

    var notificationOptions = {
        body: body
        // icon, badge 등은 일단 빼고 최소 기능만
    };

    self.registration.showNotification(title, notificationOptions);
});

// 알림 클릭 처리 (간단 버전)
self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.includes("kid-chat") && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow("/");
                }
            })
    );
});
