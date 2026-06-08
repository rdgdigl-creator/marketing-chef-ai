import type { MetaAdAccountRow } from "../types";

export const DEMO_META_USER = {
  id: "demo_meta_user_001",
  name: "Demo Marketing Chef",
};

export const DEMO_AD_ACCOUNT = {
  id: "act_demo_restaurant_01",
  name: "Ресторан «Белая Терраса» — Demo",
  currency: "RUB",
};

export const DEMO_AD_ACCOUNTS: MetaAdAccountRow[] = [
  {
    id: "mock-acct-1",
    meta_account_id: DEMO_AD_ACCOUNT.id,
    name: DEMO_AD_ACCOUNT.name,
    currency: "RUB",
    account_status: "1",
    is_selected: true,
  },
  {
    id: "mock-acct-2",
    meta_account_id: "act_demo_restaurant_02",
    name: "Кафе «Уголок» — Demo",
    currency: "RUB",
    account_status: "1",
    is_selected: false,
  },
];
