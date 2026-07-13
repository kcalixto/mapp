import { Cog } from "lucide-react";
import type { ReactElement } from "react";

export type Site = {
  slug: string;
  url: string;
  title: string;
  icon?: ReactElement<any, any>;
};

// O cover de cada site é servido de /public/<slug>.jpg
export const sites: Site[] = [
  {
    slug: "bilhete-unico-app",
    url: "http://kcalixto-sa-east-1-bilhete-unico-static-site.s3-website-sa-east-1.amazonaws.com/bilheteunico.html",
    title: "Calculadora de Bilhete Único",
  },
  {
    slug: "calendario-de-tarefas",
    url: "https://wpp-template-prod.s3.us-east-1.amazonaws.com/index.html",
    title: "Calendário de Tarefas",
  },
  {
    slug: "card-plenaria-up",
    url: "https://card-plenaria-up-webpage.s3.sa-east-1.amazonaws.com/card_plenaria.html",
    title: "Card Plenária UP",
  },
  {
    slug: "livraria",
    url: "http://livraria-serverless-deployment-dev.s3-website-sa-east-1.amazonaws.com",
    title: "Livraria",
  },
  {
    slug: "livraria",
    url: "http://livraria-serverless-deployment-dev.s3-website-sa-east-1.amazonaws.com/backoffice",
    title: "Livraria Backoffice",
    icon: <Cog size={32} color={"white"} />,
  },
];
