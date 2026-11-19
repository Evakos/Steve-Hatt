"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChristmasDaysPicker from "./christmas-days-picker";
import SlotsGrid from "./slots-grid";

type GridProps = Parameters<typeof SlotsGrid>[0];

interface Props {
  dates: GridProps["dates"];
  initialDisabled: string[];
  initialChristmasDays: string[];
  year: number;
  christmasOn: boolean;
}

/**
 * The Christmas days picker and the slots grid together, so a day picked and saved shows its snowflake in
 * the grid straight away instead of only after the page is reloaded.
 */
export default function SlotsAdmin({ dates, initialDisabled, initialChristmasDays, year, christmasOn }: Props) {
  const router = useRouter();
  const [christmasDays, setChristmasDays] = useState<string[]>(initialChristmasDays);

  return (
    <>
      <ChristmasDaysPicker
        initialDays={initialChristmasDays}
        year={year}
        christmasOn={christmasOn}
        onSaved={(days) => {
          setChristmasDays(days);
          // Also re-read the page's data, so a newly picked day that isn't listed yet (for example a Monday) appears.
          router.refresh();
        }}
      />
      <SlotsGrid dates={dates} initialDisabled={initialDisabled} christmasDays={christmasDays} />
    </>
  );
}
