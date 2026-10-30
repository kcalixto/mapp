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
    url: "http://mapp-bilhete-unico-prod.s3-website-sa-east-1.amazonaws.com/",
    title: "Calculadora de Bilhete Único",
  },
  {
    slug: "calendario-de-tarefas",
    url: "http://mapp-wpp-template-prod.s3-website-sa-east-1.amazonaws.com",
    title: "Calendário de Tarefas",
  },
  {
    slug: "card-generator",
    url: "http://mapp-card-generator-prod.s3-website-sa-east-1.amazonaws.com",
    title: "Card Plenária UP",
  },
  {
    slug: "livraria",
    url: "https://edicoes.zonasul.click",
    title: "Livraria",
  },
  {
    slug: "livraria",
    url: "https://edicoes.zonasul.click/backoffice",
    title: "Livraria Backoffice",
    icon: <Cog size={32} color={"white"} />,
  },
  {
    slug: "livraria",
    url: "https://dev-edicoes.zonasul.click",
    title: "Livraria DEV",
  },
  {
    slug: "livraria",
    url: "https://dev-edicoes.zonasul.click/backoffice",
    title: "Livraria Backoffice DEV",
    icon: <Cog size={32} color={"white"} />,
  },
];
