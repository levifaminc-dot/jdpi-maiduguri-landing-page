import {redirect} from 'next/navigation';
// No real staff data/session exists yet. Fail closed until the backend is connected.
export default function WorkspacePage() {redirect('/');}
