import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const steps = [
  'go to appleid.apple.com on your browser',
  'sign in with your apple id',
  'click "sign-in & security"',
  'click "app-specific passwords"',
  'click the + button',
  'name it "flo."',
  'copy the generated password',
  'paste it into the field below',
];

export function AppPasswordGuide() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline text-left"
          style={{ color: "#8a8a8a", fontFamily: "Fraunces, serif", fontWeight: 200 }}
        >
          how do i get my app-specific password?
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md p-8 border-0"
        style={{ background: "#0f0f0f", color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}
      >
        <h3 className="text-xl mb-4 lowercase">getting your apple app-specific password</h3>
        <ol className="space-y-3 text-sm">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span style={{ color: "#4a5e6e" }}>{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-6 self-start px-5 py-2 rounded-full text-sm"
          style={{ background: "#e8dfd4", color: "#0f0f0f", fontFamily: "Fraunces, serif", fontWeight: 200 }}
        >
          got it
        </button>
      </DialogContent>
    </Dialog>
  );
}