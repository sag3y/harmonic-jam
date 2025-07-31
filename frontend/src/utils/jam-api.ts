import axios from 'axios';

export interface ICompany {
    id: number;
    company_name: string;
    liked: boolean;
}

export interface ICollection {
    id: string;
    collection_name: string;
    companies: ICompany[];
    total: number;
}

export interface ICompanyBatchResponse {
    companies: ICompany[];
}

const BASE_URL = 'http://localhost:8000';

export async function getCompanies(offset?: number, limit?: number): Promise<ICompanyBatchResponse> {
    try {
        const response = await axios.get(`${BASE_URL}/companies`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsById(id: string, offset?: number, limit?: number): Promise<ICollection> {
    try {
        const response = await axios.get(`${BASE_URL}/collections/${id}`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsMetadata(): Promise<ICollection[]> {
    try {
        const response = await axios.get(`${BASE_URL}/collections`);
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function addCompanyToCollection(
  collectionId: string,
  companyId: number
): Promise<ICompany> {
  try {
    const response = await axios.post(
      `${BASE_URL}/collections/${collectionId}/companies`,
      {
        company_id: companyId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding company to collection:", error);
    throw error;
  }
}

export async function removeCompanyFromCollection(
  collectionId: string,
  companyId: number
): Promise<{ message: string }> {
  try {
    const response = await axios.delete(
      `${BASE_URL}/collections/${collectionId}/companies/${companyId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing company from collection:", error);
    throw error;
  }
}

export async function bulkAddCompaniesToCollection(
  collectionId: string,
  companyIds: number[]
): Promise<{ companies: ICompany[]; total: number }> {
  try {
    const response = await axios.post(
      `${BASE_URL}/collections/${collectionId}/companies/bulk`,
      {
        company_ids: companyIds,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error bulk-adding companies to collection:", error);
    throw error;
  }
}

export async function bulkRemoveCompaniesFromCollection(
  collectionId: string,
  companyIds: number[]
): Promise<{ companies: ICompany[]; total: number }> {
  try {
    const response = await axios.request({
      url: `${BASE_URL}/collections/${collectionId}/companies/bulk`,
      method: "DELETE",
      data: { company_ids: companyIds },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk-removing companies from collection:", error);
    throw error;
  }
}