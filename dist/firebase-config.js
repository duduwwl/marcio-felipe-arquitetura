// App Web separado no projeto Firebase Zoryon. Os dados do portfólio usam
// uma coleção própria; a autenticação e as regras controlam o acesso.
export const firebaseConfig = {
  apiKey: "AIzaSyAVCZ-O-8NJk6Senbi3Y6O5HTOd99JgKug",
  authDomain: "zoryon-web-portfolio.firebaseapp.com",
  projectId: "zoryon-web-portfolio",
  appId: "1:477059621908:web:302069736252187b083301"
};

export const adminEmail = "dudumesquita2004@gmail.com";
export const projectCollection = "marcioFelipeProjects";
export const recaptchaSiteKey = "6Lfks_gtAAAAADYHFGTEXkVa81bOHNM03ZWzklUQ";
export const firebaseConfigured = Object.values(firebaseConfig).every(value => typeof value === "string" && value.length > 0);
