import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, setDoc, doc, getDoc } from "firebase/firestore";

export interface GameResult {
    score: number;
    level: number;
    killCount: number;
}

// Ensure the score is saved in 'scores' collection for history
// and update 'users/{userId}' for personal bests/progress
export const saveGameResult = async (userId: string, userName: string, result: GameResult) => {
    if (!userId) return;

    try {
        // 1. Add to history
        await addDoc(collection(db, "scores"), {
            userId,
            userName,
            score: result.score,
            level: result.level,
            killCount: result.killCount,
            timestamp: serverTimestamp()
        });

        // 2. Check and update personal high score
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (result.score > (userData.highScore || 0)) {
                await setDoc(userRef, {
                    highScore: result.score,
                    lastPlayed: serverTimestamp(),
                    userName // Update name in case it changed
                }, { merge: true });
            } else {
                await setDoc(userRef, {
                    lastPlayed: serverTimestamp()
                }, { merge: true });
            }
        } else {
            // New user entry
            await setDoc(userRef, {
                userName,
                highScore: result.score,
                createdAt: serverTimestamp(),
                lastPlayed: serverTimestamp()
            });
        }

    } catch (e) {
        console.error("Error saving game result: ", e);
    }
};

export const getLeaderboard = async (limitCount = 10) => {
    try {
        const q = query(collection(db, "users"), orderBy("highScore", "desc"), limit(limitCount));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
        return [];
    }
};
