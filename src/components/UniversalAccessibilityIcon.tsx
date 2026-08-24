import React from 'react';

interface UniversalAccessibilityIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Símbolo Universal de Acessibilidade da ONU (Padrão Global / EqualWeb)
 * Substitui o antigo ícone tradicional de cadeira de rodas pela figura humana simétrica
 * com braços abertos, representando a inclusão universal de todas as pessoas com deficiência
 * (visual, auditiva, física, intelectual e neurodiversa).
 */
export const UniversalAccessibilityIcon: React.FC<UniversalAccessibilityIconProps> = ({
  className = "w-5 h-5",
  size,
  width,
  height,
  ...props
}) => {
  const iconWidth = size || width || 24;
  const iconHeight = size || height || 24;

  return (
    <svg
      viewBox="0 0 24 24"
      width={iconWidth}
      height={iconHeight}
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Círculo externo do símbolo da ONU */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      
      {/* Cabeça do indivíduo */}
      <circle cx="12" cy="6.2" r="1.6" />
      
      {/* Braços estendidos em ângulo inclusivo (Vitruviano / ONU) */}
      <path
        d="M4.8 9.6 C 7.2 8.4, 9.5 7.8, 12 7.8 C 14.5 7.8, 16.8 8.4, 19.2 9.6 C 19.7 9.8, 20.2 9.6, 20.4 9.1 C 20.6 8.6, 20.4 8.1, 19.9 7.8 C 17.3 6.6, 14.7 6, 12 6 C 9.3 6, 6.7 6.6, 4.1 7.8 C 3.6 8.1, 3.4 8.6, 3.6 9.1 C 3.8 9.6, 4.3 9.8, 4.8 9.6 Z"
        fill="currentColor"
      />
      
      {/* Tronco central e pernas abertas simetricamente */}
      <path
        d="M11 9 L11 12.2 L8.6 17.4 C 8.3 18.0, 8.6 18.7, 9.2 18.9 C 9.8 19.2, 10.5 18.9, 10.7 18.3 L12 15.4 L13.3 18.3 C 13.5 18.9, 14.2 19.2, 14.8 18.9 C 15.4 18.7, 15.7 18.0, 15.4 17.4 L13 12.2 L13 9 Z"
        fill="currentColor"
      />
    </svg>
  );
};
