'use client';

import { useEffect, useRef, useState } from 'react';

type TabSwitcherProps = {
  config: {
    label: string;
    value: React.ReactNode;
  }[];
};

export function TabSwitcher({ config }: TabSwitcherProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: '0px', width: '0px' });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const firstElement = tabRefs.current[0];
      if (firstElement) {
        const { offsetLeft, offsetWidth } = firstElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    });
  }, []);

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-none'>
        <div className='relative'>
          <div
            className='absolute flex h-[30px] items-center rounded-[6px] bg-foreground/10 transition-all duration-300 ease-out'
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          <div
            className='absolute bottom-[-6px] h-[2px] bg-foreground transition-all duration-300 ease-out'
            style={activeStyle}
          />

          <div
            className='relative flex items-center space-x-[6px]'
            role='tablist'
          >
            {config.map((tab, index) => (
              <div
                key={tab.label}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                role='tab'
                tabIndex={0}
                aria-selected={index === activeIndex}
                aria-controls={`panel-${tab.label}`}
                className={`h-[30px] cursor-pointer px-3 py-2 transition-colors duration-300 ${index === activeIndex ? 'text-foreground' : 'text-foreground/60'}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              >
                <div className='flex h-full items-center justify-center whitespace-nowrap font-[var(--www-mattmannucci-me-geist-regular-font-family)] text-sm leading-5'>
                  {tab.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className='relative mt-4 h-[calc(100%-44px)]'
        role='tabpanel'
        id={`panel-${config[activeIndex]?.label}`}
        aria-labelledby={config[activeIndex]?.label}
      >
        {config[activeIndex]?.value}
      </div>
    </div>
  );
}
