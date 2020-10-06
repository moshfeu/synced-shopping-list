import firebase from 'firebase';
import { app } from './firebase';

const provider = new firebase.auth.GoogleAuthProvider();

export const auth = firebase.auth(app);

export async function login() {
  await auth.signInWithPopup(provider);
}

export async function logout() {
  await auth.signOut();
}
