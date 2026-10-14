// Public contact channels; WhatsApp uses international digits.
export const contact = {
  email: 'kurianbenny@gmail.com',
  whatsappNumber: '919496368053', // International digits only; no + or spaces.
  whatsappMessage: 'Hi Kurian, I would like to discuss a project.',
  emailEnabled: true,
  whatsappEnabled: true,
};
const placeholderEmail = /@(?:example\.(?:com|org|net)|localhost)$/i;
export const emailReady = contact.emailEnabled && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && !placeholderEmail.test(contact.email);
export const whatsappReady = contact.whatsappEnabled && /^[1-9]\d{7,14}$/.test(contact.whatsappNumber) && contact.whatsappNumber !== '910000000000';
export const whatsappUrl = whatsappReady ? `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage)}` : undefined;

export const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScsX6aH2n2ELtd-v-2LvINIUEC8UUSNXSfK7pZcg2skOx52ZA/viewform';
