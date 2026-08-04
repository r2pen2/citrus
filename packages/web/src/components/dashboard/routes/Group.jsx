import { Routes, Route } from 'react-router-dom';

import { GroupNew, GroupInvite, GroupDetail, GroupAdd } from "../../resources/Groups";

export default function Groups() {
  return (
    <div>
        <Routes>
            <Route path="*" element={<GroupDetail />}/>
            <Route path="/invite" element={<GroupInvite />}/>
            <Route path="/new" element={<GroupNew />}/>
            <Route path="/add" element={<GroupAdd />}/>
        </Routes>
    </div>
  )
}
