export default function YearPicker({ selectedYear, selectingYear, onPressYear, startYear, endYear, }: {
    selectedYear: number | undefined;
    selectingYear: boolean;
    onPressYear: (year: number) => any;
    startYear: number;
    endYear: number;
}): JSX.Element;
