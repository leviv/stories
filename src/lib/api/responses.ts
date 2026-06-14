import { db } from '$lib/firebase';
import {
	collection,
	addDoc,
	getDocs,
	query,
	orderBy,
	limit,
	serverTimestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'how_are_you_responses';

export async function saveResponse(text: string) {
	try {
		const responsesRef = collection(db, COLLECTION_NAME);
		await addDoc(responsesRef, {
			text,
			timestamp: serverTimestamp()
		});
	} catch (error) {
		console.error('Error saving response:', error);
	}
}

export async function getResponses(maxCount: number = 50): Promise<string[]> {
	try {
		const responsesRef = collection(db, COLLECTION_NAME);
		const q = query(responsesRef, orderBy('timestamp', 'desc'), limit(maxCount));
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => doc.data().text as string);
	} catch (error) {
		console.error('Error getting responses:', error);
		return [];
	}
}
