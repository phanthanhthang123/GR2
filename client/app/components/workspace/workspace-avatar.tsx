export const WorkspaceAvatar = ({
  color,
  name,
}: {
  color: string;
  name: string;
}) => {
  const getInitials = (name: string) => {
    const names = name.split(" ");
    let initials = names[0].charAt(0).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].charAt(0).toUpperCase();
    }
    return initials;
  };

  return (
    <div
      className="w-6 h-6 rounded flex items-center justify-center"
      style={{ backgroundColor: color }}
      title={name}
    >
      <span className="text-xs font-medium text-white">
        {getInitials(name)}
      </span>
    </div>
  );
};
