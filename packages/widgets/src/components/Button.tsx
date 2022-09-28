import { estimateTextWidth } from "../utils";

const { widget } = figma;
const { Text, AutoLayout, SVG } = widget;


export type Variant = 'cta' | 'primary' | 'secondary' | 'negative';
export interface ButtonProps {
  children: string;
  onClick: (e: WidgetClickEvent) => void | Promise<unknown>;
  variant?: Variant;
  icon?: (fill?: string) => string;
  disabled?: boolean;
}

interface VariantStyles extends WidgetJSX.HoverStyle {
  hover: WidgetJSX.HoverStyle;
  text: WidgetJSX.HoverStyle;
  hoverText?: WidgetJSX.HoverStyle;
}

const STYLES: Record<Variant, VariantStyles> = {
  cta: {
    text: {
      fill: '#ffffff'
    },
    fill: '#1473e6',
    hover: {
      fill: '#0d66d0'
    },
  },
  primary: {
    text: {
      fill: '#000000ff'
    },
    stroke: '#000000ff',
    hover: {
      fill: '#000000ff'
    },
    hoverText: {
      fill: '#ffffffff'
    }
  },
  secondary: {
    text: {
      fill: '#747474'
    },
    fill: '#74747400',
    stroke: '#747474',
    hover: {
      fill: '#747474',
    },
    hoverText: {
      fill: '#ffffff'
    }
  },
  negative: {
    text: {
      fill: '#e34850'
    },
    stroke: '#e34850',
    hover: {
      fill: '#e34850'
    },
    hoverText: {
      fill: '#ffffff'
    }
  }
}

export const Button: FunctionalWidget<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  onClick,
  disabled = false
}) => {
  return (
    <AutoLayout
      padding={8}
      width={330}
      horizontalAlignItems={'center'}
      height={40}
      cornerRadius={14}
      strokeWidth={2}
      stroke={STYLES[variant]['stroke']}
      fill={STYLES[variant]['fill']}
      hoverStyle={STYLES[variant]['hover']}
      onClick={disabled ? () => {} : onClick}
      >
        <AutoLayout
          width={'fill-parent'}>
          {icon
          ? <>
              <SVG 
                opacity={0}
                x={(330 - 16 - estimateTextWidth(children[0], 20))/2 - 25}
                y={2}
                height={20}
                width={20}
                positioning="absolute"
                src={icon((STYLES[variant]['hoverText']?.fill ?? STYLES[variant]['text']?.fill) as string)} 
                hoverStyle={{opacity: 1}}/> 
              <SVG 
                x={(330 - 16 - estimateTextWidth(children[0], 20))/2 - 25}
                y={2}
                height={20}
                width={20}
                positioning="absolute"
                src={icon(STYLES[variant]['text'].fill as string)} 
                hoverStyle={{opacity: 0}}/> 
            </>
          : <></>} 
        
          <Text
            fill={STYLES[variant]['text']['fill']}
            fontSize={20}
            hoverStyle={STYLES[variant]['hoverText']}
            width={"fill-parent"}
            horizontalAlignText={"center"}>
              {icon ? `${' '.repeat(1)}${children}` : children}
          </Text>
        </AutoLayout>
    </AutoLayout>
  );
}