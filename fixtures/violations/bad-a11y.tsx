import { Badge, Button } from "@nakagater/ui";

export function BadA11y() {
  return (
    <div>
      <Button size="icon">
        <svg aria-hidden="true" />
      </Button>
      <Badge className="bg-primary text-white">recolored</Badge>
      <button type="button">raw button</button>
    </div>
  );
}
