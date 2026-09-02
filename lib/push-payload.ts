export function genericPushPayload(event: 'checkpoint' | 'caregiver') {
  return {
    title: 'Saisha Bloom',
    body: event === 'checkpoint'
      ? 'A gentle Saisha Bloom check-in is ready.'
      : 'A caregiver added a new Saisha Bloom observation.',
    url: '/dashboard',
  };
}
