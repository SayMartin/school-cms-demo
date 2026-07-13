import Image from "next/image";
import { mediaUrl, DISH_FALLBACK_IMAGE_KEY } from "@/lib/r2/client";
import { RichTextContent } from "@/components/rich-text-content";

type Dish = {
  name: string | null;
  description?: string | null;
  allergens?: string | null;
  price: number | null;
  studentPrice: number | null;
  vegetarian: boolean | null;
  vegan: boolean | null;
  imageKey: string | null;
};

export function DishItem({
  dish,
  actions,
}: {
  dish: Dish;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden">
        <Image
          src={mediaUrl(dish.imageKey ?? DISH_FALLBACK_IMAGE_KEY)}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{dish.name}</span>
          {dish.vegetarian && (
            <span className="rounded-full border border-brand-green-dark px-2 py-0.5 text-base text-brand-green-dark">
              Vegetarian
            </span>
          )}
          {dish.vegan && (
            <span className="rounded-full border border-brand-green-dark px-2 py-0.5 text-base text-brand-green-dark">
              Vegan
            </span>
          )}
        </div>
        {(dish.description || dish.allergens) && (
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-base text-gray-800">
            {dish.description && <RichTextContent html={dish.description} />}
            {dish.description && dish.allergens && (
              <span className="text-gray-500">·</span>
            )}
            {dish.allergens && (
              <RichTextContent html={dish.allergens} className="text-gray-600" />
            )}
          </div>
        )}
        {(dish.price !== null || dish.studentPrice !== null) && (
          <p className="mt-1 text-base text-gray-700">
            {dish.price !== null && <span>{dish.price} kr</span>}
            {dish.price !== null && dish.studentPrice !== null && (
              <span className="mx-1 text-gray-700">·</span>
            )}
            {dish.studentPrice !== null && (
              <span>Student {dish.studentPrice} kr</span>
            )}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-6">{actions}</div>
      )}
    </div>
  );
}
