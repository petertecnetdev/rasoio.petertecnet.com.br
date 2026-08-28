import React from "react";
import PropTypes from "prop-types";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Rasoio render error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="container py-5 text-center">
          <img
            src="/images/logo.png"
            alt="Rasoio"
            width="88"
            height="88"
            style={{ objectFit: "contain" }}
          />
          <h1 className="h3 mt-4">Não foi possível exibir esta tela</h1>
          <p className="text-secondary">
            O Rasoio encontrou um erro inesperado. Recarregue a aplicação para tentar novamente.
          </p>
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            Recarregar
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
