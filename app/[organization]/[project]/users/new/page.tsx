import { CreateUser } from '@/components/users/CreateUser'

export async function generateStaticParams() {
  return [{ organization: '_placeholder', project: '_placeholder' }]
}

export default function NewUserPage() {
  return <CreateUser />
}
