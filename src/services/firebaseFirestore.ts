import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { auth } from './firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Appointment, ClinicalProgressNote } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// databaseId di-hardcode langsung ke ID database aktif Anda
export const db = getFirestore(app, "ai-studio-holisticnursingc-41f2a8eb-ff7f-4984-b7f9-2f30fc8a3169");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: the client is currently offline.');
    }
  }
}
testConnection();

// ================= USER PROFILES =================

export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const userDocRef = doc(db, 'users', profile.id);
    const cleanData: Record<string, any> = {
      id: profile.id,
      name: profile.name || '',
      patientNumber: profile.patientNumber || '',
      phone: profile.phone || '',
      email: (profile.email || '').toLowerCase().trim(),
      address: profile.address || '',
      emergencyContact: profile.emergencyContact || '',
      medicalNotes: profile.medicalNotes || '',
      joinedDate: profile.joinedDate || new Date().toISOString().split('T')[0],
      isGuest: Boolean(profile.isGuest),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userDocRef, cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function getAllUserProfilesFromFirestore(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as UserProfile);
    });
    return list;
  } catch (err) {
    console.warn('getAllUserProfilesFromFirestore error:', err);
    return [];
  }
}

export function subscribeUserProfile(
  userId: string,
  onUpdate: (user: UserProfile | null) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('subscribeUserProfile error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// ================= APPOINTMENTS =================

export async function saveAppointmentToFirestore(appointment: Appointment): Promise<void> {
  const path = `appointments/${appointment.id}`;
  try {
    const appDocRef = doc(db, 'appointments', appointment.id);
    const payload = {
      ...appointment,
      userEmail: (appointment.userEmail || '').toLowerCase().trim(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(appDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAppointmentFromFirestore(appointmentId: string): Promise<void> {
  const path = `appointments/${appointmentId}`;
  try {
    const appDocRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeAppointments(
  currentUser: UserProfile | null,
  isAdmin: boolean,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
) {
  const path = 'appointments';
  const appointmentsRef = collection(db, 'appointments');

  let q;
  if (isAdmin) {
    q = query(appointmentsRef);
  } else if (currentUser && currentUser.id && !currentUser.isGuest) {
    q = query(appointmentsRef, where('userId', '==', currentUser.id));
  } else {
    onUpdate([]);
    return () => {};
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Appointment);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('subscribeAppointments error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// ================= CLINICAL PROGRESS NOTES =================

export async function saveProgressNoteToFirestore(note: ClinicalProgressNote): Promise<void> {
  const path = `clinical_progress_notes/${note.id}`;
  try {
    const noteDocRef = doc(db, 'clinical_progress_notes', note.id);
    const payload = {
      ...note,
      patientEmail: (note.patientEmail || '').toLowerCase().trim(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(noteDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProgressNoteFromFirestore(noteId: string): Promise<void> {
  const path = `clinical_progress_notes/${noteId}`;
  try {
    const noteDocRef = doc(db, 'clinical_progress_notes', noteId);
    await deleteDoc(noteDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeProgressNotes(
  currentUser: UserProfile | null,
  isAdmin: boolean,
  onUpdate: (notes: ClinicalProgressNote[]) => void,
  onError?: (err: any) => void
) {
  const path = 'clinical_progress_notes';
  const notesRef = collection(db, 'clinical_progress_notes');

  let q;
  if (isAdmin) {
    q = query(notesRef);
  } else if (currentUser && currentUser.id && !currentUser.isGuest) {
    q = query(notesRef, where('patientId', '==', currentUser.id));
  } else {
    onUpdate([]);
    return () => {};
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ClinicalProgressNote[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ClinicalProgressNote);
      });
      list.sort((a, b) => new Date(b.visitDate || 0).getTime() - new Date(a.visitDate || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('subscribeProgressNotes error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}
