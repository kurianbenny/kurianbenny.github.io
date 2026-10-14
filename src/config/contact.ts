// Replace the placeholders and enable each channel when ready to publish.
export const contact = {
  email: 'hello@example.com',
  whatsappNumber: '910000000000', // International digits only; no + or spaces.
  whatsappMessage: 'Hi Kurian, I would like to discuss a project.',
  formEnabled: false,
  whatsappEnabled: false,
};
const placeholderEmail = /@(?:example\.(?:com|org|net)|localhost)$/i;
export const formReady = contact.formEnabled && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && !placeholderEmail.test(contact.email);
export const whatsappReady = contact.whatsappEnabled && /^[1-9]\d{7,14}$/.test(contact.whatsappNumber) && contact.whatsappNumber !== '910000000000';
export const whatsappUrl = whatsappReady ? `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage)}` : undefined;
