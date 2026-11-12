"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { gaEvent, productItem, type GaItem } from "@/lib/gtag";

// A product list as GA4 sees it (view_item_list / select_item): which list a product card is shown in.
export interface ItemList {
  id: string;
  name: string;
}

const ItemListContext = createContext<ItemList | null>(null);

type ListProduct = { id?: string; slug?: string; title?: string; price?: number; category?: string | null };

const listItems = (list: ItemList, products: ListProduct[]): GaItem[] =>
  products.map((p, index) => productItem(p, { item_list_id: list.id, item_list_name: list.name, index }));

// Wraps a list of product cards: sends view_item_list once for each distinct set of products shown, and lets the
// cards inside send select_item with the same list.
export function ItemListScope({ list, products, children }: { list: ItemList; products: ListProduct[]; children: React.ReactNode }) {
  const sent = useRef<string>("");
  const signature = `${list.id}|${products.map((p) => p.slug || p.id).join(",")}`;
  useEffect(() => {
    if (!products.length || sent.current === signature) return;
    sent.current = signature;
    gaEvent("view_item_list", { item_list_id: list.id, item_list_name: list.name, items: listItems(list, products) });
    // the signature captures everything the event depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return <ItemListContext.Provider value={list}>{children}</ItemListContext.Provider>;
}

// select_item for a product card clicked inside an ItemListScope (no-op outside one).
export function useSelectItem() {
  const list = useContext(ItemListContext);
  return (product: ListProduct, index?: number) => {
    if (!list) return;
    gaEvent("select_item", {
      item_list_id: list.id,
      item_list_name: list.name,
      items: [productItem(product, { item_list_id: list.id, item_list_name: list.name, ...(typeof index === "number" ? { index } : {}) })],
    });
  };
}

// A stable GA4 list id from a label ("Suzani Jackets" -> "suzani_jackets").
export const listId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "list";
