import { SoapBubbles } from "@/components/soap-bubbles";

export default function BubblesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1>Soap bubbles</h1>
      <p className="text-gray-600 text-center max-w-sm">
        Click the face in the bottom left to blow soap bubbles.
      </p>
      <SoapBubbles />
    </main>
  );
}
