import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function ContactInfo() {
  return (
    <div className="text-sm text-gray-400 mt-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="group relative inline-block">
          <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-gray-600 shadow-lg">
            Regular users get 2 pick & ban sessions per day<br/>
            Admins get unlimited pick & ban sessions
          </div>
        </div>
        <span className="font-medium">For any issues, please contact me at</span>
      </div>
      <p className='flex flex-col items-center'>
        <Link target="_blank" href="mailto:oskar.wichtowski3@gmail.com" className="text-blue-400 hover:underline">oskar.wichtowski3@gmail.com</Link>
        <span className='text-gray-400'>or</span>
        <Link target="_blank" href="https://discord.com/users/oshkii" className="text-blue-400 hover:underline">message me on discord</Link>
      </p>
    </div>
  );
} 