import toast from 'react-hot-toast';
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { getGenres } from '../../services/catalogService.js';
import { createGenre, deleteGenre, updateGenre } from '../../services/adminService.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';

function GenreForm({ genre, onClose, onSaved }) {
  const form = useFormState({ name: genre?.name || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit(
      (v) => (genre ? updateGenre(genre.id, v.name.trim()) : createGenre(v.name.trim())),
      (v) => (v.name.trim() ? {} : { name: 'Vui lòng nhập tên thể loại' })
    );
    if (ok) { toast.success(genre ? 'Đã cập nhật thể loại' : 'Đã thêm thể loại'); onSaved(); }
  };

  return (
    <FormModal title={genre ? 'Sửa thể loại' : 'Thêm thể loại'} onClose={onClose} onSubmit={handleSubmit} saving={form.saving} maxWidth="max-w-md">
      <FormField label="Tên thể loại *" name="name" value={form.values.name} onChange={form.change} error={form.errors.name} autoFocus />
    </FormModal>
  );
}

export default function AdminGenres() {
  const [editing, setEditing] = useState(null);
  const genres = useFetch(getGenres, []);
  const del = useConfirmDelete((g) => deleteGenre(g.id), genres.reload, 'Đã xóa thể loại');

  const columns = [
    { key: 'name', header: 'Tên thể loại', render: (g) => <span className="font-semibold">{g.name}</span> },
    { key: 'slug', header: 'Đường dẫn (slug)', render: (g) => <span className="font-mono text-xs text-slate-400">{g.slug}</span> },
    { key: 'count', header: 'Số phim', render: (g) => g.movie_count },
    { key: 'actions', header: '', className: 'text-right', render: (g) => <RowActions onEdit={() => setEditing(g)} onDelete={() => del.ask(g)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quản lý thể loại"><Button onClick={() => setEditing('new')}>+ Thêm thể loại</Button></PageHeader>
      <AdminTable columns={columns} rows={genres.data} loading={genres.loading} error={genres.error} onRetry={genres.reload} />
      {editing && <GenreForm genre={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); genres.reload(); }} />}
      <ConfirmDialog open={!!del.target} title="Xóa thể loại" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa thể loại <b>{del.target?.name}</b>?
        {del.target?.movie_count > 0 && <> Thể loại này đang gắn với <b>{del.target.movie_count}</b> phim; các phim vẫn còn, chỉ mất nhãn thể loại này.</>}
      </ConfirmDialog>
    </div>
  );
}
