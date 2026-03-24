"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface Company {
  id: string;
  name: string;
  token?: string;
  fb_ad_account_id?: string;
  fb_access_token?: string;
  amocrm_domain?: string;
  amocrm_access_token?: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company;
  setSelectedCompany: (company: Company) => void;
  isAll: boolean;
  refreshCompanies: () => void;
}

const defaultCompany = { id: "all", name: "Barcha Loyihalar" };

const CompanyContext = createContext<CompanyContextType>({
  companies: [defaultCompany],
  selectedCompany: defaultCompany,
  setSelectedCompany: () => {},
  isAll: true,
  refreshCompanies: () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([defaultCompany]);
  const [selectedCompany, setSelectedCompany] = useState<Company>(defaultCompany);

  const refreshCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.companies) {
        setCompanies([defaultCompany, ...data.companies]);
      }
    } catch (err) {
      console.error("Loyihalarni yuklashda xato:", err);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, []);

  const isAll = selectedCompany.id === "all";

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, isAll, refreshCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
