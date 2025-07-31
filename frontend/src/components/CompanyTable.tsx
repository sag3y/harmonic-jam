import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { addCompanyToCollection, getCollectionsById, getCollectionsMetadata, removeCompanyFromCollection, bulkAddCompaniesToCollection, bulkRemoveCompaniesFromCollection, ICompany } from "../utils/jam-api";

const CompanyTable = (props: { selectedCollectionId: string }) => {
  const [response, setResponse] = useState<ICompany[]>([]);
  const [total, setTotal] = useState<number>();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);

  const [likedCollectionId, setLikedCollectionId] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState<boolean>(false);

  const fetchCompanies = () => {
    if (props.selectedCollectionId) {
        getCollectionsById(props.selectedCollectionId, offset, pageSize).then(
          (newResponse) => {
            setResponse(newResponse.companies);
            setTotal(newResponse.total);
          }
        );
    }
  };

  useEffect(() => {
    getCollectionsMetadata().then((collections) => {
      const likedCollection = collections.find(
        (c: { collection_name: string }) =>
          c.collection_name === "Liked Companies List"
      );
      if (likedCollection) {
        setLikedCollectionId(likedCollection.id);
      }
    });
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [props.selectedCollectionId, offset, pageSize]);

  useEffect(() => {
    setOffset(0);
  }, [props.selectedCollectionId]);

  const handleBulkLike = async () => {
    if (!likedCollectionId || selectedCompanies.length === 0) return;
    setIsBulkActionLoading(true);

    try {
      await bulkAddCompaniesToCollection(likedCollectionId, selectedCompanies);
      fetchCompanies(); // Re-fetch is appropriate for bulk actions
    } catch (error) {
      console.error("Error bulk liking companies:", error);
    } finally {
      setIsBulkActionLoading(false);
      setSelectedCompanies([]);
    }
  };

  const handleBulkUnlike = async () => {
    if (!likedCollectionId || selectedCompanies.length === 0) return;
    setIsBulkActionLoading(true);

    try {
      await bulkRemoveCompaniesFromCollection(likedCollectionId, selectedCompanies);
      fetchCompanies(); // Re-fetch is appropriate for bulk actions
    } catch (error) {
      console.error("Error bulk unliking companies:", error);
    } finally {
      setIsBulkActionLoading(false);
      setSelectedCompanies([]);
    }
  };

  // OPTIMIZATION: Optimistically updates UI
  const handleToggleLike = async (companyId: number, isLiked: boolean) => {
    if (!likedCollectionId) {
      console.error("Liked collection ID not found");
      return;
    }

    // Updates the UI right away.
    setResponse(currentCompanies =>
      currentCompanies.map(company =>
        company.id === companyId ? { ...company, liked: !isLiked } : company
      )
    );

    // Sends the API request in the background. If liked, remove it. If not, add it
    try {
      if (isLiked) {
        await removeCompanyFromCollection(likedCollectionId, companyId);
      } else {
        await addCompanyToCollection(likedCollectionId, companyId);
      }
    } catch (error) {
      console.error("Error toggling company like status:", error);
      // If  API call fails, revert the UI change to the original 'isLiked' state and notify the user
      setResponse(currentCompanies =>
        currentCompanies.map(company =>
          company.id === companyId ? { ...company, liked: isLiked } : company
        )
      );
      alert("Failed to update like status. Please try again.");
    }
  };

  const columns: GridColDef[] = [
    { field: "liked", headerName: "Liked", width: 90, type: 'boolean' },
    { field: "id", headerName: "ID", width: 90 },
    { field: "company_name", headerName: "Company Name", width: 200 },
    {
      field: "actions",
      headerName: "Like",
      width: 140,
      renderCell: (params) => (
        <button
          onClick={() => handleToggleLike(params.row.id, params.row.liked)}
          style={{
            fontSize: "16px",
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {params.row.liked ? "⭐" : "☆"}
        </button>
      ),
    },
  ];

  return (
    <div style={{ height: 650, width: "100%" }}>
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleBulkLike}
          disabled={isBulkActionLoading || selectedCompanies.length === 0}
          className={`px-3 py-1 rounded ${
            isBulkActionLoading || selectedCompanies.length === 0 ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {isBulkActionLoading ? "Loading..." : "Add to liked"}
        </button>

        <button
          onClick={handleBulkUnlike}
          disabled={isBulkActionLoading || selectedCompanies.length === 0}
          className={`px-3 py-1 rounded ${
            isBulkActionLoading || selectedCompanies.length === 0 ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
          } text-white`}
        >
          {isBulkActionLoading ? "Loading..." : "Remove from liked"}
        </button>
      </div>

      <DataGrid
        rows={response}
        rowHeight={30}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={(ids) =>
          setSelectedCompanies(ids as number[])
        }
        rowSelectionModel={selectedCompanies}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        rowCount={total}
        pagination
        paginationMode="server"
        onPaginationModelChange={(newMeta) => {
          setPageSize(newMeta.pageSize);
          setOffset(newMeta.page * newMeta.pageSize);
        }}
      />
    </div>
  );
};

export default CompanyTable;