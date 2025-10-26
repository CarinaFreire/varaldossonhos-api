import enviarEmail from "./enviarEmail.js";


enviarEmail("seuemail@gmail.com", "Teste Varal dos Sonhos", "Este é um teste de envio via Gmail OAuth2")
  .then(console.log)
  .catch(console.error);
