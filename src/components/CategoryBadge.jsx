import { colorClasses, Icon } from '../lib/icons.jsx';

export default function CategoryBadge({ category, size = 'md', className = '' }) {
  const boxSize = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const iconSize = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
  const color = colorClasses[category?.color] || colorClasses.coral;

  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl ${boxSize} ${color} ${className}`}>
      <Icon name={category?.icon} className={iconSize} />
    </span>
  );
}
