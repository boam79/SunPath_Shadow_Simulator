export async function GET() {
  return new Response('google-site-verification: google635228f3e17c5761.html', {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
