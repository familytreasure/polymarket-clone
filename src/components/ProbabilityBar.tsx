interface Props {
  prices: number[];
  outcomes: string[];
}

export function ProbabilityBar({ prices, outcomes }: Props) {
  const yesPrice = prices[0] ?? 0.5;
  const noPrice = prices[1] ?? 1 - yesPrice;
  const yesLabel = outcomes[0] ?? 'Yes';
  const noLabel = outcomes[1] ?? 'No';

  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden h-2 bg-pm-border">
        <div
          className="bg-pm-green transition-all duration-500 ease-out"
          style={{ width: `${yesPrice * 100}%` }}
        />
        <div className="bg-pm-red transition-all duration-500 ease-out flex-1" />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-pm-muted">
        <span>
          {yesLabel}{' '}
          <span className="text-pm-green font-medium">{Math.round(yesPrice * 100)}%</span>
        </span>
        <span>
          {noLabel}{' '}
          <span className="text-pm-red font-medium">{Math.round(noPrice * 100)}%</span>
        </span>
      </div>
    </div>
  );
}
