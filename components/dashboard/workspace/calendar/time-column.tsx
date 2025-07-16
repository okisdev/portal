export function TimeColumn() {
  const getHoursOfDay = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  return (
    <div className='select-none divide-y'>
      {getHoursOfDay().map((hour) => (
        <div className='relative h-[60px]' key={hour}>
          <div className='-left-[2px] absolute top-0 h-4 translate-y-[-50%] pl-2 text-muted-foreground text-xs'>
            {hour.toString().padStart(2, '0')}:00
          </div>
        </div>
      ))}
    </div>
  );
}
