const { widget } = figma;
const { useEffect, Text, Frame, AutoLayout, Rectangle, useSyncedState } = widget

export const Button = ({
  children,
  onClick
}: {children: string; onClick: () => void | Promise<void>}) => {
  return (
    <AutoLayout
      padding={8}
      width={300}
      cornerRadius={14}
      fill={{
        type: 'gradient-linear', 
        gradientHandlePositions: [
          { x: 0, y: 0.5 },
          { x: 1, y: 1 },
          { x: 0, y: 0 }
        ],
        gradientStops: [
          {position: 0, color: { r: 1, g: 0.4, b: 0.4, a: 0.8 }},
          {position: 1, color: { r: 166/255, g: 57/255, b: 226/255, a: 0.8 } }
        ],
      }}
      onClick={onClick}>
        <Text
          fill={"#fff"}
          fontSize={20}
          width={"fill-parent"}
          horizontalAlignText={"center"}>
            {children}
        </Text>
    </AutoLayout>
  );
}