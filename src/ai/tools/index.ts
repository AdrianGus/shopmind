import type { ToolAction } from "genkit";

import { addToCartTool } from "./add-to-cart.tool.js";
import { checkoutTool } from "./checkout.tool.js";
import { getCartTool } from "./get-cart.tool.js";
import { getOrderStatusTool } from "./get-order-status.tool.js";
import { getProductDetailsTool } from "./get-product-details.tool.js";
import { searchCatalogTool } from "./search-catalog.tool.js";

export { addToCartTool } from "./add-to-cart.tool.js";
export { checkoutTool } from "./checkout.tool.js";
export { getCartTool } from "./get-cart.tool.js";
export { getOrderStatusTool } from "./get-order-status.tool.js";
export { getProductDetailsTool } from "./get-product-details.tool.js";
export { searchCatalogTool } from "./search-catalog.tool.js";

export const allTools: ToolAction[] = [
  searchCatalogTool,
  getProductDetailsTool,
  getCartTool,
  addToCartTool,
  checkoutTool,
  getOrderStatusTool,
];
