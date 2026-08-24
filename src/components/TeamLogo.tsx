import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  teamName: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Componente padronizado para exibição dos escudos dos clubes.
 * Evita inconsistências de tamanho, distorções ou cortes circulares artificiais (overflow),
 * garantindo proporção óptica uniforme com suporte a qualquer formato de escudo (circular, escudo clássico, suíço, etc.)
 */
export const TeamLogo: React.FC<TeamLogoProps> = ({
  teamName,
  logoUrl,
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl, teamName]);

  const sizeClasses = {
    sm: 'w-6 h-6 min-w-[24px] min-h-[24px]',
    md: 'w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px]',
    lg: 'w-10 h-10 min-w-[40px] min-h-[40px]',
    xl: 'w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px]'
  }[size];

  const acronym = (teamName || 'TM')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase() || 'TM';

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center select-none ${sizeClasses} ${className}`}
      title={teamName}
    >
      {!hasError && logoUrl ? (
        <img
          key={logoUrl}
          src={logoUrl}
          alt={`Escudo do ${teamName}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
          onError={() => {
            setHasError(true);
          }}
        />
      ) : (
        <div className="w-full h-full rounded-md bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-tight shadow-sm">
          {acronym}
        </div>
      )}
    </div>
  );
};
