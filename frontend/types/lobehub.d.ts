declare module '@lobehub/icons' {
  import * as React from 'react';
  
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
  }
  
  interface IconComponent extends React.FC<IconProps> {
    Color?: React.FC<IconProps>;
    Text?: React.FC<IconProps>;
    Brand?: React.FC<IconProps>;
    BrandColor?: React.FC<IconProps>;
    Combine?: React.FC<IconProps & { type?: string }>;
    Avatar?: React.FC<IconProps>;
  }
  
  export const Gemini: IconComponent;
  export const OpenRouter: IconComponent;
}
