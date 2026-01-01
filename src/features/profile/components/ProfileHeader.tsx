import React from 'react';
import { UserProfile } from '@/types';
import { User } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl border-4 border-white shadow-sm">
        {initials || <User size={32} />}
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
        <p className="text-sm text-gray-500 font-medium">{profile.goal}</p>
        <div className="flex items-center gap-2 mt-1">
             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {profile.age} years
             </span>
             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {profile.gender}
             </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileHeader);