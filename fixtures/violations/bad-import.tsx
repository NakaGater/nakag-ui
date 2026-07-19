import { Button } from "@nakagater/ui/dist/components/ui/button";

export function BadImport({ color }: { color: string }) {
  return (
    <Button className={`bg-${color}-500`}>
      dynamic
    </Button>
  );
}
