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
    getCollectionsById(props.selectedCollectionId, offset, pageSize).then(
      (newResponse) => {
        setResponse(newResponse.companies);
        setTotal(newResponse.total);
      }
    );
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
      fetchCompanies();
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
      fetchCompanies();
    } catch (error) {
      console.error("Error bulk unliking companies:", error);
    } finally {
      setIsBulkActionLoading(false);
      setSelectedCompanies([]);
    }
  };

  const handleToggleLike = async (companyId: number, isLiked: boolean) => {
    try {
      if (!likedCollectionId) {
        console.error("Liked collection ID not found");
        return;
      }

      if (isLiked) {
        await removeCompanyFromCollection(likedCollectionId, companyId);
      } else {
        await addCompanyToCollection(likedCollectionId, companyId);
      }

      fetchCompanies();
    } catch (error) {
      console.error("Error toggling company like status:", error);
    }
  };

  const columns: GridColDef[] = [
    { field: "liked", headerName: "Liked", width: 90 },
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