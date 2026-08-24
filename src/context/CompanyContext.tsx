"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

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

  // ⚡ Bolt Optimization: Wrap refreshCompanies in useCallback to keep callback reference stable
  const refreshCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.companies) {
        setCompanies([defaultCompany, ...data.companies]);
      }
    } catch (err) {
      console.error("Loyihalarni yuklashda xato:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.companies) {
          setCompanies([defaultCompany, ...data.companies]);
        }
      })
      .catch((err) => {
        console.error("Loyihalarni yuklashda xato:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isAll = selectedCompany.id === "all";

  // ⚡ Bolt Optimization: Memoize context value object to prevent re-rendering all application components consuming useCompany on parent renders
  const contextValue = useMemo(
    () => ({
      companies,
      selectedCompany,
      setSelectedCompany,
      isAll,
      refreshCompanies,
    }),
    [companies, selectedCompany, isAll, refreshCompanies]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
