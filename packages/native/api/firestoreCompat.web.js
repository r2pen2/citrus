/**
 * RN-Firebase-shaped Firestore API over the Firebase JS SDK (Expo web).
 * Lets dbManager / Dashboard onSnapshot / People queries run on citrusnative.joed.dev.
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestoreDb as db } from "./firebase.web";

function wrapSnap(snap) {
  return {
    exists: typeof snap.exists === "function" ? snap.exists() : !!snap.exists,
    data: () => snap.data(),
    id: snap.id,
  };
}

function createDocRef(collectionPath, docId) {
  const ref = doc(db, collectionPath, docId);
  return {
    id: docId,
    path: `${collectionPath}/${docId}`,
    async get() {
      return wrapSnap(await getDoc(ref));
    },
    async set(data) {
      await setDoc(ref, data);
    },
    async delete() {
      await deleteDoc(ref);
    },
    onSnapshot(observer, onError) {
      const next = typeof observer === "function" ? observer : observer?.next;
      const error =
        typeof onError === "function"
          ? onError
          : typeof observer === "object"
            ? observer?.error
            : undefined;
      return onSnapshot(
        ref,
        (snap) => next && next(wrapSnap(snap)),
        (err) => error && error(err)
      );
    },
  };
}

function createQuery(collectionPath, constraints) {
  return {
    where(fieldPath, opStr, value) {
      return createQuery(collectionPath, [
        ...constraints,
        where(fieldPath, opStr, value),
      ]);
    },
    async get() {
      const q = query(collection(db, collectionPath), ...constraints);
      const snap = await getDocs(q);
      return {
        docs: snap.docs.map((d) => wrapSnap(d)),
        empty: snap.empty,
        size: snap.size,
      };
    },
  };
}

function createCollectionRef(collectionPath) {
  const colRef = collection(db, collectionPath);
  return {
    doc(docId) {
      return createDocRef(collectionPath, docId);
    },
    where(fieldPath, opStr, value) {
      return createQuery(collectionPath, [where(fieldPath, opStr, value)]);
    },
    async add(data) {
      const newRef = await addDoc(colRef, data);
      return createDocRef(collectionPath, newRef.id);
    },
  };
}

export default function firestore() {
  return {
    collection(collectionPath) {
      return createCollectionRef(collectionPath);
    },
  };
}
