import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../core/input/heading";
import { RowContainer } from "../../../styles/containers/styles";
import { ButtonPanel, Filter } from "../../../core/list/styles";
import { Button } from "../../../core/elements";
import Search from "../../../core/search";
import FormInput from "../../../core/input";
import NoDataFound from "../../../core/list/nodata";
import ListTableSkeleton from "../../../core/loader/shimmer";
import { useToast } from "../../../core/toast";
import { GetIcon } from "../../../../icons";
import { getData, postData, putData, deleteData } from "../../../../backend/api";
import MultiSelect from "../../../core/multiSelect";
import { useMessage } from "../../../core/message/useMessage";

function generateRandomCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude ambiguous chars
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const AvTeam = (props) => {
  const toast = useToast();
  const { showMessage } = useMessage();

  const [eventId, setEventId] = useState(props?.openData?.data?._id || null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [avCodes, setAvCodes] = useState([]);
  const [sessionsMap, setSessionsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSessions, setFormSessions] = useState([]); // array of {id, value}

  useEffect(() => {
    if (props?.openData?.data?._id) setEventId(props.openData.data._id);
  }, [props?.openData?.data?._id]);

  // Fetch sessions for MultiSelect and for mapping session IDs to names
  const fetchSessionsSelect = async (evId) => {
    try {
      const response = await getData({ event: evId }, "sessions/select");
      const items = response?.data || [];
      const map = {};
      items.forEach((it) => {
        // The MultiSelect expects {id, value}
        map[String(it.id || it._id)] = it.value;
      });
      setSessionsMap(map);
    } catch (e) {
      // non-blocking
    }
  };

  // Fetch AV codes, expecting assignerSessions to be array of {_id, value}
  const fetchAvCodes = async (evId) => {
    setListLoading(true);
    try {
      const response = await getData({ event: evId }, "av-code");
      if (response?.status === 200) {
        // The new API returns response.response as the array
        const list = response?.data?.response || response?.data || [];
        setAvCodes(list);
      }
    } catch (e) {
      toast.error("Failed to load AV codes");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!eventId) return;
      setLoading(true);
      await Promise.all([fetchSessionsSelect(eventId), fetchAvCodes(eventId)]);
      setLoading(false);
    };
    init();
  }, [eventId]);

  const openCreate = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCode(generateRandomCode());
    setFormSessions([]);
    setIsModalOpen(true);
  };

  // For edit, map assignerSessions (array of {_id, value}) to MultiSelect format
  const openEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item?.title || "");
    setFormCode(item?.code || generateRandomCode());
    const selected = (item?.assignerSessions || []).map((session) => ({
      id: String(session._id),
      value: session.value,
    }));
    setFormSessions(selected);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    const itemName = item?.title || item?.code || "code";
    showMessage({
      type: 2,
      content: `Do you want to delete '${itemName}'? This action cannot be undone.`,
      proceed: "Delete",
      okay: "Cancel",
      data: item,
      onProceed: async () => {
        try {
          const res = await deleteData({ id: item._id }, "av-code");
          if (res?.status === 200) {
            toast.success("Deleted");
            fetchAvCodes(eventId);
            return true;
          }
          toast.error("Delete failed");
          return false;
        } catch (e) {
          toast.error("Delete failed");
          return false;
        }
      },
    });
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCode("");
    setFormSessions([]);
    setIsModalOpen(false);
  };

  // When submitting, send assignerSessions as array of session IDs
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!eventId) {
      toast.error("Missing event");
      return;
    }
    if (!formTitle?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formCode?.trim()) {
      toast.error("Code is required");
      return;
    }
    const sessionIds = (formSessions || []).map((s) => s.id);
    const payload = {
      title: formTitle.trim(),
      event: eventId,
      code: formCode.trim(),
      assignerSessions: sessionIds,
    };
    try {
      let res;
      if (editingItem?._id) {
        res = await putData({ id: editingItem._id, ...payload }, "av-code");
      } else {
        res = await postData(payload, "av-code");
      }
      if (res?.status === 200) {
        toast.success(editingItem ? "Updated" : "Created");
        resetForm();
        fetchAvCodes(eventId);
      } else {
        toast.error("Save failed");
      }
    } catch (e) {
      toast.error("Save failed");
    }
  };

  // Filtering by title or code
  const filteredAvCodes = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    if (!key) return avCodes;
    return (avCodes || []).filter((item) =>
      (item?.title || "").toLowerCase().includes(key) ||
      (item?.code || "").toLowerCase().includes(key)
    );
  }, [searchTerm, avCodes]);

  if (loading) {
    return (
      <RowContainer className="data-layout">
        <ListTableSkeleton viewMode={"table"} tableColumnCount={4} />
      </RowContainer>
    );
  }

  return (
    <RowContainer className="data-layout">
      <PageHeader
        title="AV Team Codes"
        description="Assign one code to multiple sessions for the AV team."
        line={false}
      />

      <ButtonPanel className="custom">
        <div className="flex items-center gap-3">
          <Search
            title="Search"
            placeholder="Search by title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter onClick={() => {}}>
            <GetIcon icon="filter" />
            <span>Filter</span>
          </Filter>
        </div>

        <div className="flex items-center gap-3">
          <Button value="Add Code" icon="add" ClickEvent={openCreate} type="primary" align="bg-primary-base hover:bg-primary-dark text-white" />
        </div>
      </ButtonPanel>

      {listLoading ? (
        <ListTableSkeleton viewMode={"table"} tableColumnCount={4} />
      ) : filteredAvCodes.length === 0 ? (
        <NoDataFound
          shortName="AV Codes"
          icon="key"
          addPrivilege={true}
          addLabel="Add Code"
          isCreatingHandler={openCreate}
          description="Create your first AV team code and assign sessions."
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm bg-bg-white border border-stroke-soft rounded-lg">
            <thead>
              <tr className="bg-bg-weak text-text-sub">
                <th className="text-left px-4 py-2 border-b border-stroke-soft">Title</th>
                <th className="text-left px-4 py-2 border-b border-stroke-soft">Code</th>
                <th className="text-left px-4 py-2 border-b border-stroke-soft">Sessions</th>
                <th className="text-left px-4 py-2 border-b border-stroke-soft">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAvCodes.map((item) => {
                // assignerSessions is now array of {_id, value}
                const sessions = (item?.assignerSessions || []).map((session) => session.value || session._id);
                return (
                  <tr key={item._id} className="hover:bg-bg-weak">
                    <td className="px-4 py-2 text-text-main">{item?.title || "-"}</td>
                    <td className="px-4 py-2 text-text-main font-mono">{item?.code}</td>
                    <td className="px-4 py-2 text-text-sub">
                      {sessions.length === 0 ? (
                        <span className="text-text-disabled">No sessions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {sessions.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-bg-soft text-text-soft border border-stroke-soft">
                              {s}
                            </span>
                          ))}
                          {sessions.length > 4 && (
                            <span className="px-2 py-0.5 rounded bg-bg-soft text-text-soft border border-stroke-soft">+{sessions.length - 4}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button value="Edit" ClickEvent={() => openEdit(item)} type="secondary" align="bg-bg-weak hover:bg-bg-soft text-text-main" />
                        <Button value="Delete" ClickEvent={() => handleDelete(item)} type="secondary" align="bg-state-error hover:bg-red-600 text-white" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{editingItem ? "Edit AV Code" : "Create AV Code"}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <FormInput
                  type="text"
                  name="title"
                  label="Title"
                  placeholder="Eg: Main Hall Team"
                  required={true}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  customClass="full"
                />
              </div>

              <div>
                {/* <label className="block text-sm font-medium text-text-sub mb-1">Sessions</label> */}
                <MultiSelect
                  label="Assign Sessions"
                  apiType="API"
                  selectApi={`sessions/select`}
                  params={[{ name: "event", value: eventId }]}
                  value={formSessions}
                  onSelect={(items) => setFormSessions(items)}
                  placeholder="Select sessions"
                  customClass="w-full"
                />
              </div>

              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FormInput
                      type="text"
                      name="code"
                      label="Code"
                      placeholder="AUTO-GENERATED"
                      required={true}
                      value={formCode}
                      onChange={(e) => setFormCode((e.target.value || "").toUpperCase())}
                      customClass="full"
                    />
                  </div>
                  <Button value="Generate" icon="refresh" ClickEvent={() => setFormCode(generateRandomCode())} type="secondary" align="bg-bg-weak hover:bg-bg-soft text-text-main" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button value="Cancel" ClickEvent={resetForm} type="secondary" align="bg-bg-weak hover:bg-bg-soft text-text-main" />
                <Button value={editingItem ? "Save Changes" : "Create"} ClickEvent={handleSubmit} type="primary" align="bg-primary-base hover:bg-primary-dark text-white" />
              </div>
            </form>
          </div>
        </div>
      )}
    </RowContainer>
  );
};

export default AvTeam;
