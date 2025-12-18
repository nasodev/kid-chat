const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// 새 메시지가 추가되면 푸시 알림 전송
exports.sendPushOnNewMessage = functions.firestore
    .document("messages/{messageId}")
    .onCreate(async (snapshot, context) => {
        const messageData = snapshot.data();
        const senderUid = messageData.uid;
        const senderName = messageData.name || "누군가";
        const messageText = messageData.text || "";

        console.log(`새 메시지 from ${senderName}: ${messageText}`);

        try {
            // 모든 FCM 토큰 가져오기 (보낸 사람 제외, 중복 제거)
            const tokensSnapshot = await db.collection("fcmTokens").get();
            const tokenSet = new Set(); // 중복 토큰 방지

            tokensSnapshot.forEach((doc) => {
                // 보낸 사람에게는 알림 보내지 않음
                if (doc.id !== senderUid) {
                    const tokenData = doc.data();
                    if (tokenData.token && !tokenSet.has(tokenData.token)) {
                        tokenSet.add(tokenData.token);
                    }
                }
            });

            const tokens = Array.from(tokenSet);

            if (tokens.length === 0) {
                console.log("알림 보낼 토큰이 없습니다.");
                return null;
            }

            console.log(`${tokens.length}개의 기기로 알림 전송`);

            // 푸시 알림 메시지 구성
            const notification = {
                title: `${senderName}`,
                body: messageText.length > 100
                    ? messageText.substring(0, 100) + "..."
                    : messageText
            };

            // 멀티캐스트로 알림 전송
            const response = await messaging.sendEachForMulticast({
                tokens: tokens,
                notification: notification,
                data: {
                    messageId: context.params.messageId,
                    senderName: senderName
                }
            });

            console.log(`성공: ${response.successCount}, 실패: ${response.failureCount}`);

            // 실패한 토큰 정리 (만료된 토큰 삭제)
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.log(`토큰 실패: ${resp.error?.message}`);
                        failedTokens.push(tokens[idx]);
                    }
                });

                // 실패한 토큰 삭제
                const batch = db.batch();
                for (const token of failedTokens) {
                    const tokenQuery = await db
                        .collection("fcmTokens")
                        .where("token", "==", token)
                        .get();
                    tokenQuery.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                }
                await batch.commit();
                console.log(`${failedTokens.length}개의 만료된 토큰 삭제`);
            }

            return null;
        } catch (error) {
            console.error("푸시 알림 전송 실패:", error);
            return null;
        }
    });
