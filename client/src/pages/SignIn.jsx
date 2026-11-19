import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth';
import AuthForm from '../components/AuthForm';

const SignIn = () => {
    const { signin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (email, password) => {
        await signin(email, password);
        navigate('/dashboard', { replace: true });
    };

    return (
        <AuthForm
            title="Bejelentkezés"
            buttonLabel="Bejelentkezés"
            onSubmit={handleSubmit}
            footer={<>Még nincs fiókod? <Link to="/signup">Regisztráció</Link></>}
        />
    );
};

export default SignIn;
