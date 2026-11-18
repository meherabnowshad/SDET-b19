import './globals.css';

export const metadata = {
    title: 'Next.js Demo Project',
    description: 'A simple, one file-per-concept demo of React/Next.js components, events and hook.',
};

export default function RootLayout({ children}) {
    return (
        <html lang='en'>
            <body>
                <div className="container">{children}</div>
            </body>
        </html>
    );
}