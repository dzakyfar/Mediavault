interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
}

const initialsFromName = (name?: string | null) => {
  const parts = (name || 'User')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function UserAvatar({ name, src, className = 'h-10 w-10' }: UserAvatarProps) {
  return (
    <div className={`${className} aspect-square shrink-0 overflow-hidden rounded-full bg-[#1A1A1A] text-[#F5C800] flex items-center justify-center font-bold uppercase ring-1 ring-[#2A2A2A]`}>
      {src ? (
        <img src={src} alt={name || 'User avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initialsFromName(name)}</span>
      )}
    </div>
  );
}
